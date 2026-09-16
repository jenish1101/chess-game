export function ClubMark({ small = false }: { small?: boolean }) {
  return <span className={`club-mark ${small ? 'small' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span>;
}

export function Starburst() {
  return <svg className="title-star" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 3v42M3 24h42M9.2 9.2l29.6 29.6M9.2 38.8 38.8 9.2" stroke="currentColor" strokeWidth="2.6" /></svg>;
}