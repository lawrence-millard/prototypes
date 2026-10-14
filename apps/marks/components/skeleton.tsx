export function Skeleton() {
  return (
    <div className="skeleton" aria-busy="true">
      <span className="sr-only">Loading</span>
      <span className="bar" />
      <span className="bar" />
    </div>
  );
}
