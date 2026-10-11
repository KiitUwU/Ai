use std::process::Child;

pub struct JobObjectGuard {
    #[cfg(target_os = "windows")]
    job_handle: Option<windows::Win32::Foundation::HANDLE>,
}

impl JobObjectGuard {
    pub fn new() -> Self {
        #[cfg(target_os = "windows")]
        {
            use windows::Win32::System::JobObjects::*;
            unsafe {
                let job = CreateJobObjectW(None, None).ok();
                if let Some(h_job) = job {
                    let mut info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION::default();
                    info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

                    let _ = SetInformationJobObject(
                        h_job,
                        JobObjectExtendedLimitInformation,
                        &info as *const _ as *const std::ffi::c_void,
                        std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
                    );
                    return Self { job_handle: Some(h_job) };
                }
            }
            Self { job_handle: None }
        }

        #[cfg(not(target_os = "windows"))]
        {
            Self {}
        }
    }

    pub fn assign_child(&self, _child: &Child) {
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::io::AsRawHandle;
            use windows::Win32::Foundation::HANDLE;
            use windows::Win32::System::JobObjects::AssignProcessToJobObject;

            if let Some(h_job) = self.job_handle {
                let raw_handle = _child.as_raw_handle();
                unsafe {
                    let _ = AssignProcessToJobObject(h_job, HANDLE(raw_handle as _));
                }
            }
        }
    }
}

impl Drop for JobObjectGuard {
    fn drop(&mut self) {
        #[cfg(target_os = "windows")]
        {
            use windows::Win32::Foundation::CloseHandle;
            if let Some(h) = self.job_handle.take() {
                unsafe {
                    let _ = CloseHandle(h);
                }
            }
        }
    }
}
