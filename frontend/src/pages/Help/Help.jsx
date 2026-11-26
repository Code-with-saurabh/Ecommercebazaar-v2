import { Link } from 'react-router-dom';
import ServiceLayout from '../../layout/ServiceLayout';

const questions = [
  ['How do I place an order?', <>Add pieces to your <Link to="/cart">shopping bag</Link>, then sign in at checkout. Choose a delivery address and review the total before placing your order.</>],
  ['How much is shipping?', 'Shipping is free on a merchandise subtotal of $100 or more. Below $100 the flat rate is $10. Checkout shows the final charge.'],
  ['How can I pay?', 'Cash on delivery is available. You’ll see the amount due before you confirm your order.'],
  ['Where do I enter a coupon?', 'Enter the code in the coupon section at checkout and select Apply. If it is accepted, the order summary shows the discount.'],
  ['Where can I track or cancel an order?', <>Open <Link to="/account?tab=orders">your orders</Link> and select a receipt to see its status history. An unpaid order can be cancelled while its status is “Order placed”.</>],
];

export default function Help() {
  return (
    <ServiceLayout title="Help & Support" intro="A guide to shopping, delivery and your order history.">
      <h2>Frequently asked questions</h2>
      {questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
    </ServiceLayout>
  );
}
