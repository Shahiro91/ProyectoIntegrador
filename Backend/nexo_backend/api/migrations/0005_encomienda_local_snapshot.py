from django.db import migrations, models


def copiar_datos_local(apps, schema_editor):
    SolicitudEncomienda = apps.get_model('api', 'SolicitudEncomienda')
    solicitudes = SolicitudEncomienda.objects.filter(local__isnull=False).select_related('local')

    for solicitud in solicitudes.iterator():
        solicitud.local_nombre = solicitud.local.nombre
        solicitud.local_direccion = solicitud.local.direccion
        solicitud.local_telefono = solicitud.local.telefono
        solicitud.save(update_fields=('local_nombre', 'local_direccion', 'local_telefono'))


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_consulta'),
    ]

    operations = [
        migrations.AddField(
            model_name='solicitudencomienda',
            name='local_nombre',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AddField(
            model_name='solicitudencomienda',
            name='local_direccion',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='solicitudencomienda',
            name='local_telefono',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.RunPython(copiar_datos_local, migrations.RunPython.noop),
    ]