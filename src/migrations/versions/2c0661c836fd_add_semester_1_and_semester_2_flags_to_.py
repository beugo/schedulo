"""Add semester 1 and semester 2 flags to Unit

Revision ID: 2c0661c836fd
Revises: d1dfdb777a19
Create Date: 2025-05-11 21:11:51.090574

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "2c0661c836fd"
down_revision = "d1dfdb777a19"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("units", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "semester1", sa.Boolean(), nullable=False, server_default=sa.false()
            )
        )
        batch_op.add_column(
            sa.Column(
                "semester2", sa.Boolean(), nullable=False, server_default=sa.false()
            )
        )

    op.execute("UPDATE units SET semester1 = FALSE, semester2 = FALSE")


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("units", schema=None) as batch_op:
        batch_op.drop_column("semester2")
        batch_op.drop_column("semester1")

    # ### end Alembic commands ###
