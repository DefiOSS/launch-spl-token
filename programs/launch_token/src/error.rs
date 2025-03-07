use anchor_lang::prelude::*;

#[error_code]
pub enum LaunchTokenError {
    #[msg("Unauthorized User")]
    UnathorizedUser,
}
