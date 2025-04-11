use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{
        set_authority, spl_token::instruction::AuthorityType, Mint, SetAuthority, Token,
        TokenAccount,
    },
};

use crate::error::LaunchTokenError;

#[derive(Accounts)]
pub struct RevokeMint<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mint::authority = user,
        mint::freeze_authority = user
    )]
    pub mint: Account<'info, Mint>,
    pub token_account: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn revoke_mint_handler(ctx: Context<RevokeMint>) -> Result<()> {
    if ctx.accounts.mint.mint_authority.is_none() {
        return Err(LaunchTokenError::MintAuthorityRevoked.into());
    }

    let cpi_accounts = SetAuthority {
        account_or_mint: ctx.accounts.mint.to_account_info(),
        current_authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    set_authority(cpi_ctx, AuthorityType::MintTokens, None)?;

    Ok(())
}
