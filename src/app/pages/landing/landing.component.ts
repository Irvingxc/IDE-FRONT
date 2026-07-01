import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {

  navScrolled   = false;
  menuOpen      = false;
  activeSection = 'hero';

  private scrollEl: HTMLElement | null = null;
  private scrollListener = () => this.onContainerScroll();

  readonly year = new Date().getFullYear();

  readonly pilares = [
    {
      icon: 'balance',
      titulo: 'Ética',
      ingles: 'Ethics',
      desc: 'Formamos personas íntegras con sólidos valores morales y cívicos que guían cada decisión de su vida.',
    },
    {
      icon: 'science',
      titulo: 'Ciencia',
      ingles: 'Science',
      desc: 'Desarrollamos el pensamiento crítico y científico mediante metodologías activas y laboratorios modernos.',
    },
    {
      icon: 'devices',
      titulo: 'Tecnología',
      ingles: 'Technology',
      desc: 'Preparamos a nuestros estudiantes para el mundo digital con herramientas y competencias del siglo XXI.',
    },
  ];

  readonly nivelesEducativos = [
    {
      nivel: 'Prebásica',
      ingles: 'Pre-Basic Education',
      icon: 'child_care',
      desc: 'Formamos los cimientos del aprendizaje con estimulación temprana, juego educativo e inmersión bilingüe desde los primeros años de vida.',
      grados: [
        { grado: 'Pre-Kínder', rango: 'Edad 3 – 4 años', detalle: 'Estimulación temprana, psicomotricidad y primeros pasos en inglés.' },
        { grado: 'Kínder',     rango: 'Edad 5 – 6 años', detalle: 'Lecto-escritura inicial, matemáticas básicas y desarrollo socioemocional bilingüe.' },
      ]
    },
    {
      nivel: 'Educación Básica',
      ingles: 'Basic Education',
      icon: 'menu_book',
      desc: 'Currículo nacional enriquecido con enfoque bilingüe, pensamiento científico, tecnología y sólida formación en valores en todos los grados.',
      grados: [
        { grado: 'Primaria',   rango: '1° – 6° Grado', detalle: 'Ciencias, matemáticas, historia y artes con instrucción bilingüe integrada.' },
        { grado: 'Secundaria', rango: '7° – 9° Grado', detalle: 'Ciencias naturales, humanidades, inglés intermedio-avanzado y tecnología aplicada.' },
      ]
    },
    {
      nivel: 'Educación Media',
      ingles: 'High School',
      icon: 'workspace_premium',
      desc: 'Formación de alto nivel con orientación universitaria, inglés avanzado y preparación para el mercado laboral y el mundo globalizado.',
      grados: [
        { grado: 'Bachillerato', rango: '10° – 12° Grado', detalle: 'Inglés avanzado, orientación vocacional, proyecto de graduación y preparación universitaria.' },
      ]
    },
  ];

  readonly diferenciadores = [
    { icon: 'groups',           texto: 'Grupos pequeños',           sub: 'Atención personalizada a cada estudiante' },
    { icon: 'translate',        texto: 'Inmersión bilingüe',        sub: 'Español e inglés desde Pre-Kínder' },
    { icon: 'how_to_reg',       texto: 'Docentes certificados',     sub: 'Maestros calificados y en formación continua' },
    { icon: 'emoji_events',     texto: 'Excelencia académica',      sub: 'Altos estándares y seguimiento de resultados' },
    { icon: 'family_restroom',  texto: 'Comunidad familiar',        sub: 'Vínculo cercano entre padres, alumnos y escuela' },
    { icon: 'computer',         texto: 'Aulas tecnológicas',        sub: 'Recursos digitales integrados al aprendizaje' },
  ];

  readonly pasos = [
    { num: '01', titulo: 'Solicitud',   desc: 'Contáctenos por teléfono, correo o visítenos en el campus.' },
    { num: '02', titulo: 'Entrevista',  desc: 'Reunión con dirección para conocer al estudiante y a su familia.' },
    { num: '03', titulo: 'Evaluación',  desc: 'Prueba de ubicación adaptada al nivel del alumno.' },
    { num: '04', titulo: 'Matrícula',   desc: 'Entrega de documentos y formalización de la inscripción.' },
  ];

  constructor(private router: Router, private host: ElementRef) {}

  ngOnInit(): void {
    // El scroll ocurre en mat-sidenav-content, no en window
    this.scrollEl = this.host.nativeElement.closest('mat-sidenav-content') as HTMLElement
                  ?? document.querySelector('mat-sidenav-content') as HTMLElement;
    this.scrollEl?.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  ngOnDestroy(): void {
    this.scrollEl?.removeEventListener('scroll', this.scrollListener);
  }

  private onContainerScroll(): void {
    const top = this.scrollEl?.scrollTop ?? 0;
    this.navScrolled = top > 60;

    const secciones = ['hero', 'nosotros', 'programas', 'bilingue', 'admisiones', 'contacto'];
    for (const id of secciones) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom > 100) { this.activeSection = id; break; }
      }
    }
  }

  scrollTo(id: string): void {
    this.menuOpen = false;
    const target = document.getElementById(id);
    if (!target || !this.scrollEl) return;
    const offset = target.offsetTop - this.scrollEl.offsetTop;
    this.scrollEl.scrollTo({ top: offset, behavior: 'smooth' });
  }

  irLogin(): void { this.router.navigate(['/auth/login']); }
}
