export function Skeleton() {
  return (
    <div className="stack" role="status" aria-label="loading">
      <div className="bar" />
      <div className="bar" />
      <div className="bar short" />
    </div>
  )
}
