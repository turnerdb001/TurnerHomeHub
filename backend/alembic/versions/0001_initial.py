"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=80), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("display_name", sa.String(length=120), nullable=False, unique=True),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("pin_hash", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "devices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("profiles.id"), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True, index=True),
        sa.Column("mac_address", sa.String(length=64), nullable=True),
        sa.Column("device_type", sa.String(length=40), nullable=False, server_default="other"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "access_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
        sa.Column("action", sa.String(length=80), nullable=False, index=True),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("profiles.id"), nullable=True),
        sa.Column("device_id", sa.Integer(), sa.ForeignKey("devices.id"), nullable=True),
        sa.Column("client_ip", sa.String(length=64), nullable=True, index=True),
        sa.Column("domain", sa.String(length=255), nullable=True, index=True),
        sa.Column("result", sa.String(length=80), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
    )
    op.create_table(
        "bypasses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("domain", sa.String(length=255), nullable=False, index=True),
        sa.Column("client_ip", sa.String(length=64), nullable=True, index=True),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("profiles.id"), nullable=True),
        sa.Column("device_id", sa.Integer(), sa.ForeignKey("devices.id"), nullable=True),
        sa.Column("approved_by_profile_id", sa.Integer(), sa.ForeignKey("profiles.id"), nullable=True),
        sa.Column("rule_text", sa.String(length=512), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("expired_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="active", index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "app_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(length=120), nullable=False, unique=True),
        sa.Column("value_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "discord_notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event", sa.String(length=80), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="pending"),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "future_modules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False, unique=True),
        sa.Column("slug", sa.String(length=120), nullable=False, unique=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="planned"),
        sa.Column("metadata_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
    )
    op.create_table(
        "books",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="available"),
    )
    op.create_table(
        "borrowers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("profile_id", sa.Integer(), sa.ForeignKey("profiles.id"), nullable=True),
    )
    op.create_table(
        "checkouts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("book_id", sa.Integer(), sa.ForeignKey("books.id"), nullable=False),
        sa.Column("borrower_id", sa.Integer(), sa.ForeignKey("borrowers.id"), nullable=False),
        sa.Column("checked_out_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    for table in [
        "checkouts",
        "borrowers",
        "books",
        "future_modules",
        "discord_notifications",
        "app_settings",
        "bypasses",
        "access_logs",
        "devices",
        "profiles",
        "admins",
    ]:
        op.drop_table(table)
