import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      home: RestaurantsPage(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class RestaurantsPage extends StatefulWidget {
  const RestaurantsPage({super.key});

  @override
  State<RestaurantsPage> createState() => _RestaurantsPageState();
}

class _RestaurantsPageState extends State<RestaurantsPage> {
  List restaurants = [];

  @override
  void initState() {
    super.initState();
    fetchRestaurants();
  }

  Future<void> fetchRestaurants() async {
    final url = Uri.parse('http://localhost:4000/restaurants');
    final response = await http.get(url);

    if (response.statusCode == 200) {
      setState(() {
        restaurants = jsonDecode(response.body);
      });
    } else {
      print('Failed to load restaurants');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('בחר מסעדה')),
      body:
          restaurants.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                itemCount: restaurants.length,
                itemBuilder: (context, index) {
                  final restaurant = restaurants[index];
                  return Card(
                    margin: const EdgeInsets.all(10),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundImage: NetworkImage(
                          restaurant['logo_url'] ?? '',
                        ),
                      ),
                      title: Text(restaurant['name']),
                      subtitle: Text(restaurant['address']),
                      trailing: Text(
                        restaurant['status'] == 'open' ? 'פתוח' : 'סגור',
                        style: TextStyle(
                          color:
                              restaurant['status'] == 'open'
                                  ? Colors.green
                                  : Colors.red,
                        ),
                      ),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder:
                                (_) => CreateOrderPage(
                                  restaurantId: restaurant['id'],
                                ),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
    );
  }
}

class CreateOrderPage extends StatefulWidget {
  final int restaurantId;
  const CreateOrderPage({super.key, required this.restaurantId});

  @override
  State<CreateOrderPage> createState() => _CreateOrderPageState();
}

class _CreateOrderPageState extends State<CreateOrderPage> {
  int customerId = 1;
  double totalPrice = 49.90;

  Future<void> submitOrder() async {
    final url = Uri.parse('http://localhost:4000/orders');

    final response = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "customer_id": customerId,
        "restaurant_id": widget.restaurantId,
        "courier_id": null,
        "payment_method": "credit_card",
        "total_price": totalPrice,
        "cash_required": 0,
        "preparation_minutes": 0,
      }),
    );

    if (response.statusCode == 201) {
      showDialog(
        context: context,
        builder:
            (_) => const AlertDialog(
              title: Text('הזמנה נשלחה'),
              content: Text('ההזמנה שלך נקלטה בהצלחה!'),
            ),
      );
    } else {
      showDialog(
        context: context,
        builder:
            (_) => AlertDialog(
              title: const Text('שגיאה'),
              content: Text('שליחת ההזמנה נכשלה.\n${response.body}'),
            ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('JEET - הזמנה')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Text('מסעדה נבחרה: ${widget.restaurantId}'),
            TextFormField(
              initialValue: '1',
              decoration: const InputDecoration(labelText: 'Customer ID'),
              onChanged: (val) => customerId = int.tryParse(val) ?? 1,
            ),
            TextFormField(
              initialValue: '49.90',
              decoration: const InputDecoration(labelText: 'Total Price'),
              onChanged: (val) => totalPrice = double.tryParse(val) ?? 49.90,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: submitOrder,
              child: const Text('שלח הזמנה'),
            ),
          ],
        ),
      ),
    );
  }
}
