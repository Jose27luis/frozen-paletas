import 'package:intl/intl.dart';

final NumberFormat _miles = NumberFormat.decimalPattern('es_PE');
final NumberFormat _soles = NumberFormat.currency(
  locale: 'es_PE',
  symbol: 'S/ ',
  decimalDigits: 2,
);
final DateFormat _corta = DateFormat('d MMM', 'es_PE');
final DateFormat _larga = DateFormat('d MMM y', 'es_PE');

String miles(int cantidad) => _miles.format(cantidad);

String soles(String importe) => _soles.format(double.tryParse(importe) ?? 0);

String fechaCorta(String iso) => _corta.format(DateTime.parse(iso).toUtc());

String fechaLarga(String iso) => _larga.format(DateTime.parse(iso).toUtc());

String hoyEnIso() {
  final DateTime ahora = DateTime.now().toUtc().subtract(
        const Duration(hours: 5),
      );

  return DateFormat('yyyy-MM-dd').format(ahora);
}

String haceDias(int dias) {
  final DateTime hoy = DateTime.parse('${hoyEnIso()}T00:00:00Z');

  return DateFormat('yyyy-MM-dd').format(
    hoy.subtract(Duration(days: dias - 1)),
  );
}

int diasDesde(String iso) {
  final DateTime fecha = DateTime.parse(iso).toUtc();
  final DateTime hoy = DateTime.parse('${hoyEnIso()}T00:00:00Z');

  return hoy.difference(fecha).inDays.clamp(0, 99999);
}
