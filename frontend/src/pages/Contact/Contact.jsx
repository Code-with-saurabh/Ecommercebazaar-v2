import ServiceLayout, { SUPPORT_EMAIL } from '../../layout/ServiceLayout';

export default function Contact() {
  const draftEmail = event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const body = `${fields.get('message')}\n\n${fields.get('name')}\nReply to: ${fields.get('email')}`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Bazaar%20enquiry&body=${encodeURIComponent(body)}`;
  };

  return (
    <ServiceLayout title="Contact us" intro="For questions about a product or an order, reach Bazaar by phone or email.">
      <form className="contact-form" onSubmit={draftEmail}>
        <h2>Write to Bazaar</h2>
        <label className="bz-field">Name<input className="bz-input" name="name" autoComplete="name" maxLength={80} required /></label>
        <label className="bz-field">Reply email<input className="bz-input" name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label className="bz-field">Message<textarea className="bz-textarea" name="message" rows={5} maxLength={1200} required /></label>
        <p>This opens a draft in your email app. Review and send it there, or email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> directly.</p>
        <button className="bz-btn bz-btn--primary" type="submit">Open email draft</button>
      </form>
    </ServiceLayout>
  );
}
