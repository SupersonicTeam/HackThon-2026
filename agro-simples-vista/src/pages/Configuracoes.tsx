import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="text-primary" size={28} />
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Configurações</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User size={18} /> Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nome</label>
            <Input defaultValue="João da Silva" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">E-mail</label>
            <Input defaultValue="joao@fazenda.com" className="mt-1" />
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Alterar Senha</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Input type="password" placeholder="Senha atual" />
                <Input type="password" placeholder="Nova senha" />
                <Input type="password" placeholder="Confirmar nova senha" />
                <Button className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
