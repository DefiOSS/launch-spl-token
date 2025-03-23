use crate::{contants::CONFIG_SEED, error::LaunchTokenError, state::Config};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata,
    },
    token::{Mint, Token, TokenAccount},
};

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct LaunchArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
}

#[derive(Accounts)]
#[instruction(args: LaunchArgs)]
pub struct Launch<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Box<Account<'info, Config>>,
    #[account(
        init,
        payer = user,
        mint::decimals = args.decimals,
        mint::authority = user,
        mint::freeze_authority = user
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user
    )]
    pub token_account: Account<'info, TokenAccount>,
    // pub token_metadata_program: Program<'info, Metadata>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn launch_handler(ctx: Context<Launch>, args: LaunchArgs) -> Result<()> {
    let config = &mut ctx.accounts.config;

    require!(config.active, LaunchTokenError::ProgramNotActive);

    require!(args.name.len() <= 32, LaunchTokenError::NameTooLong);
    require!(args.symbol.len() <= 10, LaunchTokenError::SymbolTooLong);
    require!(args.uri.len() <= 200, LaunchTokenError::UriTooLong);
    require!(args.decimals <= 9, LaunchTokenError::InvalidDecimals);

    // let metadata_data = DataV2 {
    //     name: args.name.clone(),
    //     symbol: args.symbol.clone(),
    //     uri: args.uri.clone(),
    //     seller_fee_basis_points: 0,
    //     creators: None,
    //     collection: None,
    //     uses: None,
    // };

    // let metadata_ctx = CpiContext::new(
    //     ctx.accounts.token_metadata_program.to_account_info(),
    //     CreateMetadataAccountsV3 {
    //         metadata: ctx.accounts.mint.to_account_info(),
    //         mint: ctx.accounts.mint.to_account_info(),
    //         mint_authority: ctx.accounts.user.to_account_info(),
    //         payer: ctx.accounts.user.to_account_info(),
    //         update_authority: ctx.accounts.user.to_account_info(),
    //         system_program: ctx.accounts.system_program.to_account_info(),
    //         rent: ctx.accounts.rent.to_account_info(),
    //     },
    // );

    // create_metadata_accounts_v3(metadata_ctx, metadata_data, false, true, None)?;

    config.tokens = config
        .tokens
        .checked_add(1)
        .ok_or(LaunchTokenError::Overflow)?;

    Ok(())
}
