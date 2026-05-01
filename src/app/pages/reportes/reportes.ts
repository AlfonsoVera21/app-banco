import { Component, inject, OnInit, signal } from '@angular/core';
import { ClienteService } from '../../services/cliente.service';
import { ReporteService } from '../../services/reporte.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, NgClass],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class ReportesComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private reporteService = inject(ReporteService);

  clientes = this.clienteService.getClientes();
  reporte = signal<any | null>(null);
  errorMsg = signal<string | null>(null);

  clienteControl = new FormControl('');
  fechaInicioControl = new FormControl('');
  fechaFinControl = new FormControl('');

  ngOnInit() {
    this.clienteService.loadAll().subscribe();
  }

  generarReporte() {
    if (!this.clienteControl.value || !this.fechaInicioControl.value || !this.fechaFinControl.value) return;
    
    this.errorMsg.set(null);
    this.reporteService.getReporte(
      this.fechaInicioControl.value,
      this.fechaFinControl.value,
      Number(this.clienteControl.value)
    ).subscribe({
      next: (res) => {
        this.reporte.set(res.data);
      },
      error: (e) => this.errorMsg.set(e.error?.message || 'Error al generar reporte')
    });
  }

  downloadPdf() {
    const data = this.reporte();
    if (!data || !data['Reporte PDF Base64']) return;
    
    const linkSource = `data:application/pdf;base64,${data['Reporte PDF Base64']}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = `Reporte_${data['Cliente']}_${data['Fecha Inicio']}_${data['Fecha Fin']}.pdf`;
    downloadLink.click();
  }
}
