"""fix_friend_requests

Revision ID: 95a157441a84
Revises: da5b888b00ca
Create Date: 2025-05-05 16:10:09.962427

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "95a157441a84"
down_revision = "da5b888b00ca"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "friend_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("friend_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(
            ["friend_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("friend_requests")
    # ### end Alembic commands ###
