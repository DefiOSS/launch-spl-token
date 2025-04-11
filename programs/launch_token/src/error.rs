use anchor_lang::prelude::*;

#[error_code]
pub enum LaunchTokenError {
    #[msg("Unauthorized User")]
    UnathorizedUser,
    #[msg("Program is not active")]
    ProgramNotActive,
    #[msg("Token name too long (max 32 characters)")]
    NameTooLong,
    #[msg("Token symbol too long (max 10 characters)")]
    SymbolTooLong,
    #[msg("URI too long (max 200 characters)")]
    UriTooLong,
    #[msg("Invalid decimals (max 9)")]
    InvalidDecimals,
    #[msg("Arithmetic overflow occurred")]
    Overflow,
    #[msg("Invalid fee account")]
    InvalidFeeAccount,
    #[msg("Mint authority revoked")]
    MintAuthorityRevoked,
    #[msg("Freeze authority already revoked")]
    FreezeAlreadyRevoked,
}
