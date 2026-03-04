from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("gemmachat", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="chatmessage",
            name="is_system_call",
            field=models.BooleanField(db_index=True, default=False),
        ),
    ]
