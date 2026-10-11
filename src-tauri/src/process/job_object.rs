use std::process::Child;

pub struct JobObjectGuard {
    #[cfg(target_os = "windows")]
    job_handle: Option<isize>,
}

unsafe impl Send for JobObjectGuard {}
unsafe impl Sync for JobObjectGuard {}

#[cfg(target_os = "windows")]
#[repr(C)]
struct JobObjectBasicLimitInformation {
    per_process_user_time_limit: i64,
    per_job_user_time_limit: i64,
    limit_flags: u32,
    minimum_working_set_size: usize,
    maximum_working_set_size: usize,
    active_process_limit: u32,
    affinity: usize,
    priority_class: u32,
    scheduling_class: u32,
}

#[cfg(target_os = "windows")]
#[repr(C)]
struct IoCounters {
    read_operation_count: u64,
    write_operation_count: u64,
    other_operation_count: u64,
    read_transfer_count: u64,
    write_transfer_count: u64,
    other_transfer_count: u64,
}

#[cfg(target_os = "windows")]
#[repr(C)]
struct JobObjectExtendedLimitInformation {
    basic_limit_information: JobObjectBasicLimitInformation,
    io_info: IoCounters,
    process_memory_limit: usize,
    job_memory_limit: usize,
    peak_process_memory_used: usize,
    peak_job_memory_used: usize,
}

#[cfg(target_os = "windows")]
extern "system" {
    fn CreateJobObjectW(lpJobAttributes: *const std::ffi::c_void, lpName: *const u16) -> isize;
    fn SetInformationJobObject(
        hJob: isize,
        JobObjectInfoClass: u32,
        lpJobObjectInfo: *const std::ffi::c_void,
        cbJobObjectInfoLength: u32,
    ) -> i32;
    fn AssignProcessToJobObject(hJob: isize, hProcess: isize) -> i32;
    fn CloseHandle(hObject: isize) -> i32;
}

#[cfg(target_os = "windows")]
const JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE: u32 = 0x2000;
#[cfg(target_os = "windows")]
const JOB_OBJECT_EXTENDED_LIMIT_INFORMATION_CLASS: u32 = 9;

impl JobObjectGuard {
    pub fn new() -> Self {
        #[cfg(target_os = "windows")]
        {
            unsafe {
                let h_job = CreateJobObjectW(std::ptr::null(), std::ptr::null());
                if h_job != 0 {
                    let mut info: JobObjectExtendedLimitInformation = std::mem::zeroed();
                    info.basic_limit_information.limit_flags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

                    let _ = SetInformationJobObject(
                        h_job,
                        JOB_OBJECT_EXTENDED_LIMIT_INFORMATION_CLASS,
                        &info as *const _ as *const std::ffi::c_void,
                        std::mem::size_of::<JobObjectExtendedLimitInformation>() as u32,
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
            if let Some(h_job) = self.job_handle {
                let raw_handle = _child.as_raw_handle() as isize;
                unsafe {
                    let _ = AssignProcessToJobObject(h_job, raw_handle);
                }
            }
        }
    }
}

impl Drop for JobObjectGuard {
    fn drop(&mut self) {
        #[cfg(target_os = "windows")]
        {
            if let Some(h) = self.job_handle.take() {
                unsafe {
                    let _ = CloseHandle(h);
                }
            }
        }
    }
}
