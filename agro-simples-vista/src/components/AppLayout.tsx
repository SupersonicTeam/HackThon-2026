import { Outlet, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  Calculator,
  Sprout,
  Menu,
  X,
  Bell,
  Check,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificacoes } from "@/contexts/NotificacoesContext";

const tipoIcon: Record<string, string> = {
  "Solicitação": "📋",
  "Documento": "📄",
  "Pagamento": "💰",
};

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Calendário", path: "/calendario", icon: Calendar },
  { title: "Documentos", path: "/documentos", icon: FileText },
  { title: "Chat", path: "/chat", icon: MessageSquare },
  { title: "Contador", path: "/contador", icon: Calculator },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const { notificacoes, marcarLida, marcarTodasLidas, limparTodas, naoLidas } = useNotificacoes();

  const handleClickNotificacao = (notif: { id: number; rota: string }) => {
    marcarLida(notif.id);
    setPopoverOpen(false);
    navigate(notif.rota);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      {/* Header fixo */}
      <header className="h-14 md:h-16 bg-topbar flex items-center px-4 md:px-6 shrink-0 z-50">
        <button
          className="md:hidden mr-3 text-topbar-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Sprout className="text-sidebar-primary mr-2" size={28} />
        <span className="font-heading text-lg md:text-xl font-bold text-topbar-foreground tracking-tight">
          AgroPainel
        </span>

        <div className="ml-auto">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-topbar-foreground hover:bg-white/10">
                <Bell size={22} />
                {naoLidas > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                    {naoLidas}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[340px] max-w-[90vw] p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h4 className="font-semibold text-sm">Notificações</h4>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={marcarTodasLidas} disabled={naoLidas === 0}>
                    <Check size={14} /> Marcar lidas
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={limparTodas} disabled={notificacoes.length === 0}>
                    <Trash2 size={14} /> Limpar
                  </Button>
                </div>
              </div>
              <ScrollArea className="max-h-[320px]">
                {notificacoes.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">Nenhuma notificação</p>
                ) : (
                  <div className="divide-y">
                    {notificacoes.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleClickNotificacao(n)}
                        className={cn(
                          "w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-muted/60 transition-colors",
                          !n.lida && "bg-primary/5"
                        )}
                      >
                        <span className="text-base mt-0.5">{tipoIcon[n.tipo]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">{n.tipo}</span>
                            {!n.lida && <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />}
                          </div>
                          <p className="text-sm truncate">{n.titulo}</p>
                          <span className="text-[11px] text-muted-foreground">{n.dataHora}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar — fixa, scroll interno */}
        <aside className="hidden md:flex flex-col w-56 bg-sidebar shrink-0 border-r border-sidebar-border h-full overflow-y-auto">
          <nav className="flex-1 py-4 px-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
              >
                <item.icon size={20} />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 z-20 md:hidden">
            <div
              className="absolute inset-0 bg-foreground/30"
              onClick={() => setMobileMenuOpen(false)}
            />
            <nav className="relative bg-card rounded-b-xl shadow-lg mx-2 mt-1 p-3 space-y-1 animate-in slide-in-from-top-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon size={22} />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-6 p-3 sm:p-4 md:p-6 flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bottomnav border-t border-border flex justify-around items-center h-16 shadow-lg">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors min-w-[3rem]",
              isActive(item.path)
                ? "text-bottomnav-active"
                : "text-bottomnav-foreground"
            )}
          >
            <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-tight">{item.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
