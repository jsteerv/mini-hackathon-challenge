export function Section({ children, className = '', id = '' }) {
  return (
    <section id={id} className={`min-h-screen px-6 py-20 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </section>
  )
}
