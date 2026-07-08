/** Ambient teal aurora + film grain behind the whole app. Purely decorative. */
export function Atmosphere() {
  return (
    <div className="atmos" aria-hidden>
      <div className="atmos-blob atmos-b1" />
      <div className="atmos-blob atmos-b2" />
      <div className="atmos-blob atmos-b3" />
      <div className="atmos-grain" />
    </div>
  );
}
