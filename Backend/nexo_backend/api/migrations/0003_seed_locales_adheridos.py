from django.db import migrations


def cargar_locales(apps, schema_editor):
    Local = apps.get_model('api', 'Local')
    locales = (
        ('La Tiendita', 'Av. 9 de Julio 123, Resistencia', '+54 362 123-4567'),
        ('Delicias Corrientes', 'Sarmiento 455, Corrientes', '+54 379 987-6543'),
        ('Mercado Reconquista', 'Rivadavia 78, Reconquista', '+54 348 321-0098'),
    )

    for nombre, direccion, telefono in locales:
        Local.objects.get_or_create(
            nombre=nombre,
            defaults={'direccion': direccion, 'telefono': telefono},
        )


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0002_remove_solicitudencomienda_producto_and_more'),
    ]

    operations = [
        migrations.RunPython(cargar_locales, migrations.RunPython.noop),
    ]