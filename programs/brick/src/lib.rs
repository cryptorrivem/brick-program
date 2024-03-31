use anchor_lang::prelude::*;

declare_id!("briKNc9rEPhJAowK2hN5CnkMmLEoopR9LBqfNVENVkL");

#[program]
pub mod brick {
    use anchor_lang::system_program;

    use super::*;

    pub fn empty(ctx: Context<Empty>) -> Result<()> {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.to_empty.to_account_info(),
                    to: ctx.accounts.new_authority.to_account_info(),
                },
            ),
            ctx.accounts.to_empty.lamports(),
        )?;
        Ok(())
    }

    pub fn brick(ctx: Context<Brick>) -> Result<()> {
        let to_brick = &mut ctx.accounts.to_brick;
        to_brick.set_inner(BrickData {
            authority: ctx.accounts.new_authority.key(),
        });

        system_program::assign(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Assign {
                    account_to_assign: ctx.accounts.to_brick.to_account_info(),
                },
            ),
            &ID,
        )?;

        Ok(())
    }

    pub fn unbrick(_ctx: Context<Unbrick>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Empty<'info> {
    #[account(mut)]
    pub to_empty: Signer<'info>,
    #[account(mut)]
    pub new_authority: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Brick<'info> {
    #[account(mut)]
    pub new_authority: Signer<'info>,
    #[account(
        init,
        space = 8 + BrickData::INIT_SPACE,
        payer = new_authority,
        signer,
    )]
    pub to_brick: Account<'info, BrickData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unbrick<'info> {
    #[account(
        mut,
        address = to_unbrick.authority
    )]
    pub authority: Signer<'info>,
    #[account(
        mut,
        close = authority
    )]
    pub to_unbrick: Account<'info, BrickData>,
}

#[account]
#[derive(InitSpace)]
pub struct BrickData {
    pub authority: Pubkey,
}
