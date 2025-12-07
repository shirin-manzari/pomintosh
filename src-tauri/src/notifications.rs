use std::sync::mpsc::{self, RecvTimeoutError, Sender};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{App, AppHandle, Emitter, Manager, State};
use tauri_plugin_notification::NotificationExt;

struct Deadline {
    ends_at: u64,
    mode: String,
}

pub struct NotificationScheduler(Sender<Option<Deadline>>);

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn take_due_notification(pending: &mut Option<Deadline>, now: u64) -> Option<Deadline> {
    if pending
        .as_ref()
        .is_some_and(|deadline| deadline.ends_at <= now)
    {
        return pending.take();
    }
    None
}

fn deliver(app: &AppHandle, deadline: Deadline) {
    let (title, body) = if deadline.mode == "focus" {
        ("Focus complete!", "Time for a break.")
    } else {
        ("Break complete!", "Ready for another focus session.")
    };
    if let Err(error) = app.notification().builder().title(title).body(body).show() {
        eprintln!("Could not send completion notification: {error}");
    }
    let _ = app.emit("session-deadline", ());
}

pub fn initialize(app: &App) -> std::io::Result<()> {
    let (sender, receiver) = mpsc::channel();
    let handle = app.handle().clone();
    std::thread::Builder::new()
        .name("completion-notifications".into())
        .spawn(move || {
            let mut pending: Option<Deadline> = None;
            loop {
                if let Some(deadline) = take_due_notification(&mut pending, now_ms()) {
                    deliver(&handle, deadline);
                }
                let next = if let Some(deadline) = &pending {
                    // Recheck wall time after wake; never count polling callbacks.
                    let wait_ms = deadline.ends_at.saturating_sub(now_ms()).clamp(1, 1000);
                    match receiver.recv_timeout(Duration::from_millis(wait_ms)) {
                        Ok(next) => next,
                        Err(RecvTimeoutError::Timeout) => continue,
                        Err(RecvTimeoutError::Disconnected) => break,
                    }
                } else {
                    match receiver.recv() {
                        Ok(next) => next,
                        Err(_) => break,
                    }
                };
                // Preserve an expired alert if the next session is started before this thread wakes.
                if let Some(deadline) = take_due_notification(&mut pending, now_ms()) {
                    deliver(&handle, deadline);
                }
                pending = next;
            }
        })?;
    app.manage(NotificationScheduler(sender));
    Ok(())
}

#[tauri::command]
pub fn set_notification_deadline(
    scheduler: State<'_, NotificationScheduler>,
    ends_at: Option<u64>,
    mode: String,
) -> Result<(), String> {
    if mode != "focus" && mode != "break" {
        return Err("Invalid timer mode".into());
    }
    let deadline = ends_at.map(|ends_at| Deadline { ends_at, mode });
    scheduler
        .inner()
        .0
        .send(deadline)
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pending() -> Option<Deadline> {
        Some(Deadline {
            ends_at: 5000,
            mode: "focus".into(),
        })
    }

    #[test]
    fn waits_until_the_absolute_deadline() {
        let mut pending = pending();
        assert!(take_due_notification(&mut pending, 4999).is_none());
        assert_eq!(
            take_due_notification(&mut pending, 5000).unwrap().mode,
            "focus"
        );
    }

    #[test]
    fn delivers_once_after_sleep_past_the_deadline() {
        let mut pending = pending();
        assert!(take_due_notification(&mut pending, 28_800_000).is_some());
        assert!(take_due_notification(&mut pending, 28_800_001).is_none());
    }

    #[test]
    fn cancelled_deadlines_do_not_notify() {
        let mut pending = pending();
        pending.take();
        assert!(take_due_notification(&mut pending, 6000).is_none());
    }
}
