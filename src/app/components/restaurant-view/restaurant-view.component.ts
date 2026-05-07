import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PromotionResponse, RestauranteService } from '../../core/services/restaurante.service';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, finalize, takeUntil, timeout } from 'rxjs';

interface RestaurantViewPromotion {
  uuid: string;
  title: string;
  description?: string;
  percentDiscount: number;
  dateStartPromotion?: string;
  dateEndPromotion?: string;
}

@Component({
  selector: 'app-restaurant-view',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './restaurant-view.html',
  styleUrl: './restaurant-view.css'
})
export class RestaurantView implements OnInit, OnDestroy {

  restaurante: any = null;
  cargando = true;
  error = false;
  cargandoPromociones = false;
  promocionesError = false;
  promociones: RestaurantViewPromotion[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restauranteService: RestauranteService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    const uuid = this.route.snapshot.paramMap.get('uuid') ?? this.route.snapshot.paramMap.get('id');
    if (uuid) {
      this.cargar(uuid);
    } else {
      this.error = true;
      this.cargando = false;
      this.refreshView();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(id: string): void {
    this.cargando = true;
    this.error = false;
    this.promociones = [];
    this.cargarPromociones(id);

    this.restauranteService
      .getRestauranteById(id)
      .pipe(
        timeout(15000),
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargando = false;
          this.refreshView();
        })
      )
      .subscribe({
        next: (data: any) => {
          this.restaurante = data?.data ?? data;
          this.error = false;
        },
        error: () => {
          this.error = true;
        }
      });
  }

  formatDiscount(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(/\.?0+$/, '');
  }

  volverAlMapa(): void {
    this.router.navigate(['/mapa']);
  }

  private cargarPromociones(restaurantId: string): void {
    this.cargandoPromociones = true;
    this.promocionesError = false;

    this.restauranteService
      .getPromocionesPorRestaurante(restaurantId)
      .pipe(
        timeout(15000),
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoPromociones = false;
          this.refreshView();
        })
      )
      .subscribe({
        next: (items: PromotionResponse[] | any) => {
          this.promociones = this.normalizarPromociones(items);
        },
        error: () => {
          this.promociones = [];
          this.promocionesError = true;
        }
      });
  }

  private normalizarPromociones(raw: any): RestaurantViewPromotion[] {
    const source = Array.isArray(raw)
      ? raw
      : (Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.items) ? raw.items : []);

    return source
      .map((p: any) => {
        const uuid = `${p?.uuid ?? p?.promotionId ?? p?.promotion_id ?? ''}`.trim();
        const title = `${p?.title ?? p?.name ?? p?.nombre ?? ''}`.trim();
        const percentDiscount = Number(p?.percentDiscount ?? p?.percent_discount ?? p?.discount ?? 0);

        return {
          uuid,
          title,
          description: `${p?.description ?? p?.descripcion ?? ''}`.trim() || undefined,
          percentDiscount: Number.isFinite(percentDiscount) ? percentDiscount : 0,
          dateStartPromotion: `${p?.dateStartPromotion ?? p?.date_start_promotion ?? ''}`.trim() || undefined,
          dateEndPromotion: `${p?.dateEndPromotion ?? p?.date_end_promotion ?? ''}`.trim() || undefined
        };
      })
      .filter((p: RestaurantViewPromotion) => !!p.uuid && !!p.title);
  }

  private refreshView(): void {
    try {
      this.cd.detectChanges();
    } catch {
      // No-op: evita errores de deteccion al navegar rapido entre vistas.
    }
  }
}
