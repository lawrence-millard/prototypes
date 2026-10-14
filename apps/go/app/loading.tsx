export default function Loading() {
  return (
    <main className="frame" aria-busy="true">
      <div className="header">
        <div className="mark" />
        <div className="bar title" />
      </div>
      <div className="stack" role="status" aria-label="loading">
        <div className="bar" />
        <div className="bar" />
        <div className="bar short" />
      </div>
    </main>
  )
}
