export default function CleanerApplyPage() {
  return (
    <main className="section">
      <div className="container grid-2">
        <div>
          <div className="eyebrow">Application</div>
          <h1 className="title" style={{ marginTop: "0.6rem" }}>Cleaner application form</h1>
          <p className="lead">This is the first scaffold version of the form page. It will collect personal details, work preferences, availability, service areas, and document uploads.</p>
        </div>
        <form className="panel mini-form">
          <input placeholder="Full name" />
          <input placeholder="Email" />
          <input placeholder="Phone" />
          <input placeholder="Postcode" />
          <select defaultValue="">
            <option value="" disabled>Do you have your own supplies?</option>
            <option>Yes</option>
            <option>No</option>
          </select>
          <textarea placeholder="Tell us about your cleaning experience" rows={5} />
          <button className="button button-primary" type="button">Continue</button>
        </form>
      </div>
    </main>
  );
}
