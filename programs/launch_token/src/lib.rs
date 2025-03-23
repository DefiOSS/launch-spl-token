pub mod contants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::{initialize::*, launch::*};

declare_id!("8fAeJ4DieZX4DRuyxS8hy3onnNrMo8zEFUp2dJF5MwTY");

#[program]
pub mod launch_token {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize_handler(ctx)?;
        Ok(())
    }

    pub fn launch_token(ctx: Context<Launch>, args: LaunchArgs) -> Result<()> {
        launch_handler(ctx, args)?;
        Ok(())
    }
}
