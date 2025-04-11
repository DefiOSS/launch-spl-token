pub mod contants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::{
    initialize::*, launch::*, mint_tokens::*, revoke_freeze::*, revoke_mint::*, update_fee::*,
};

declare_id!("AGYkNasGKotZV1A5LkvxeK7mCkMQWdCjkRo4Qi64Jcct");

#[program]
pub mod launch_token {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize_handler(ctx)?;
        Ok(())
    }

    pub fn update_fee(ctx: Context<UpdateFee>, new_fee: u64) -> Result<()> {
        update_fee_handler(ctx, new_fee)?;
        Ok(())
    }

    pub fn launch_token(ctx: Context<Launch>, args: LaunchArgs) -> Result<()> {
        launch_handler(ctx, args)?;
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        mint_tokens_handler(ctx, amount)?;
        Ok(())
    }

    pub fn revoke_mint(ctx: Context<RevokeMint>) -> Result<()> {
        revoke_mint_handler(ctx)?;
        Ok(())
    }

    pub fn revoke_freeze(ctx: Context<RevokeFreeze>) -> Result<()> {
        revoke_freeze_handler(ctx)?;
        Ok(())
    }
}
