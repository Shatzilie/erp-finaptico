export function Footer() {
  return (
    <footer className="border-t bg-muted mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a 
              href="https://finaptico.com/aviso-legal" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline"
            >
              Aviso Legal
            </a>
            <span>|</span>
            <a 
              href="https://finaptico.com/politica-de-privacidad" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline"
            >
              Política de Privacidad
            </a>
            <span>|</span>
            <a 
              href="https://finaptico.com/politica-de-cookies" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline"
            >
              Política de Cookies
            </a>
          </div>
          <p>© 2025 Finaptico. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
