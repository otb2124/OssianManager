use std::process::Command;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

pub trait CommandHiddenExt {
    /// Don't flash a console window when spawning from the GUI app.
    fn hidden(&mut self) -> &mut Self;
}

impl CommandHiddenExt for Command {
    #[cfg(windows)]
    fn hidden(&mut self) -> &mut Self {
        use std::os::windows::process::CommandExt;
        self.creation_flags(CREATE_NO_WINDOW)
    }

    #[cfg(not(windows))]
    fn hidden(&mut self) -> &mut Self {
        self
    }
}