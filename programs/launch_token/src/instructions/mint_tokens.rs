use anchor_lang::{prelude::*, solana_program::program_option::COption};
use anchor_spl::token::{mint_to, Mint, MintTo, Token, TokenAccount};

use crate::error::LaunchTokenError;

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn mint_tokens_handler(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
    let mint_authority = ctx.accounts.mint.mint_authority;
    match mint_authority {
        COption::Some(authority) => {
            if authority != ctx.accounts.user.key() {
                return Err(LaunchTokenError::MintAuthorityRevoked.into());
            }
        }
        COption::None => {
            return Err(LaunchTokenError::MintAuthorityRevoked.into());
        }
    }

    let mint_to_cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let mint_to_cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        mint_to_cpi_accounts,
    );
    mint_to(mint_to_cpi_ctx, amount)?;
    Ok(())
}
