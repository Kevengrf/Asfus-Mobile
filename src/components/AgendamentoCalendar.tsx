import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ptBR } from "date-fns/locale"

import { startOfDay } from "date-fns"
import { cn } from "@/lib/utils"

export type StatusAgendamento = "pendente" | "aprovado" | "rejeitado"

export interface Agendamento {
  date: Date
  status: StatusAgendamento
  userId: string
}

interface AgendamentoCalendarProps {
  currentUserId: string
  agendamentos: Agendamento[]
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function AgendamentoCalendar({
  currentUserId,
  agendamentos,
  date,
  setDate,
}: AgendamentoCalendarProps) {
  
  // Normaliza os agendamentos para garantir que 'date' seja um objeto Date válido e sem hora (00:00:00)
  // Isso resolve problemas se o banco retornar strings ou datas com fuso horário diferente
  const normalizedAgendamentos = React.useMemo(() => {
    return agendamentos.map(a => ({
      ...a,
      date: startOfDay(new Date(a.date))
    }))
  }, [agendamentos])
  
  // 1. Filtrar datas ocupadas por OUTRAS pessoas (exclui rejeitados, pois liberam a vaga)
  const diasOcupadosPorOutros = normalizedAgendamentos
    .filter((a) => a.userId !== currentUserId && a.status !== "rejeitado")
    .map((a) => a.date)

  // 2. Filtrar MEUS agendamentos pendentes
  const meusPendentes = normalizedAgendamentos
    .filter((a) => a.userId === currentUserId && a.status === "pendente")
    .map((a) => a.date)

  // 3. Filtrar MEUS agendamentos aprovados
  const meusAprovados = normalizedAgendamentos
    .filter((a) => a.userId === currentUserId && a.status === "aprovado")
    .map((a) => a.date)

  return (
    <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
      <DayPicker
        mode="single"
        selected={date}
        onSelect={setDate}
        locale={ptBR}
        
        // Desabilita dias ocupados por outros para não serem clicáveis
        disabled={diasOcupadosPorOutros}

        // Modificadores para aplicar estilos condicionais baseados nas listas acima
        modifiers={{
          meuPendente: meusPendentes,
          meuAprovado: meusAprovados,
          ocupadoOutros: diasOcupadosPorOutros,
        }}

        // Estilos Tailwind para cada estado específico
        modifiersClassNames={{
          selected: "bg-blue-600 text-white hover:bg-blue-700 rounded-full", // Seleção momentânea
          
          meuPendente: "bg-yellow-200 text-yellow-800 font-bold rounded-full hover:bg-yellow-300", // Amarelo
          
          meuAprovado: "bg-green-200 text-green-800 font-bold rounded-full hover:bg-green-300", // Verde
          
          ocupadoOutros: "text-gray-300 cursor-not-allowed font-normal decoration-slate-300 bg-transparent", // Cinza (Outros)
        }}
        
        // Classes gerais para estilizar o calendário (estilo shadcn/ui)
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-200 rounded-md flex items-center justify-center",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-full flex items-center justify-center cursor-pointer"),
          day_today: "bg-gray-100 text-gray-900 font-semibold",
          day_outside: "text-gray-300 opacity-50",
          day_disabled: "text-gray-300 opacity-50",
          day_hidden: "invisible",
        }}
      />
      
      {/* Legenda Visual */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs justify-center border-t pt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-200 border border-yellow-300"></div>
          <span className="text-gray-600">Pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></div>
          <span className="text-gray-600">Aprovado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center text-[8px] border border-gray-200">X</div>
          <span className="text-gray-400">Indisponível</span>
        </div>
      </div>
    </div>
  )
}