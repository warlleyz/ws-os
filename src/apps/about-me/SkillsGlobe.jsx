import { useEffect, useMemo, useRef } from 'react';
import {
  SiDocker,
  SiFigma,
  SiGit,
  SiGithub,
  SiHtml5,
  SiJavascript,
  SiMongodb,
  SiOpenjdk,
  SiPostgresql,
  SiPython,
  SiReact,
  SiSpringboot,
  SiTailwindcss,
  SiTypescript,
  SiVite,
} from 'react-icons/si';
import { FaCss3Alt } from 'react-icons/fa';
import './SkillsGlobe.css';

/* === Tecnologias reais do perfil === */
/* ----- Ícones, nomes e cores reconhecíveis ----- */
const TECHNOLOGIES = [
  { name: 'Java', icon: SiOpenjdk, color: '#e76f51' },
  { name: 'JavaScript', icon: SiJavascript, color: '#f7df1e' },
  { name: 'React', icon: SiReact, color: '#61dafb' },
  { name: 'TypeScript', icon: SiTypescript, color: '#3178c6' },
  { name: 'Python', icon: SiPython, color: '#3776ab' },
  { name: 'Spring Boot', icon: SiSpringboot, color: '#6db33f' },
  { name: 'HTML', icon: SiHtml5, color: '#e34f26' },
  { name: 'CSS', icon: FaCss3Alt, color: '#1572b6' },
  { name: 'Docker', icon: SiDocker, color: '#2496ed' },
  { name: 'Git', icon: SiGit, color: '#f05032' },
  { name: 'MongoDB', icon: SiMongodb, color: '#47a248' },
  { name: 'PostgreSQL', icon: SiPostgresql, color: '#4169e1' },
  { name: 'Vite', icon: SiVite, color: '#a78bfa' },
  { name: 'Tailwind CSS', icon: SiTailwindcss, color: '#06b6d4' },
  { name: 'Figma', icon: SiFigma, color: '#f24e1e' },
  { name: 'GitHub', icon: SiGithub, color: '#a3a3a3' },
];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const PROJECTED_RADIUS = 0.36;
const AUTO_ROTATION = 0.00013;

/* ----- Distribuição de Fibonacci sobre uma esfera ----- */
function spherePoints(total) {
  return Array.from({ length: total }, (_, index) => {
    const y = 1 - (2 * (index + 0.5)) / total;
    const ring = Math.sqrt(1 - y * y);
    const angle = index * GOLDEN_ANGLE;
    return { x: Math.cos(angle) * ring, y, z: Math.sin(angle) * ring };
  });
}

/* === Globo interativo === */
export default function SkillsGlobe({ locale = 'pt-BR', minimized = false }) {
  const stageRef = useRef(null);
  const itemRefs = useRef([]);
  const rotationRef = useRef({ x: -0.22, y: 0.48 });
  const dragRef = useRef(null);
  const rafRef = useRef(0);
  const projectRef = useRef(null);
  const points = useMemo(() => spherePoints(TECHNOLOGIES.length), []);
  const help = locale === 'en' ? 'Drag to rotate the technologies' : 'Arraste para girar as tecnologias';

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    let visible = true;
    let reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let lastTime = 0;
    let frame = 0;
    let width = 0;
    let height = 0;
    let ancestorsHidden = false;
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');

    const ancestorWindow = stage.closest('.desktop-window');
    const updateHidden = () => {
      ancestorsHidden = ancestorWindow?.getAttribute('aria-hidden') === 'true';
    };
    updateHidden();

    function project() {
      const { x: rx, y: ry } = rotationRef.current;
      const sinX = Math.sin(rx);
      const cosX = Math.cos(rx);
      const sinY = Math.sin(ry);
      const cosY = Math.cos(ry);
      const radius = Math.min(width, height) * PROJECTED_RADIUS;
      const centerX = width / 2;
      const centerY = height / 2;

      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        const element = itemRefs.current[index];
        if (!element) continue;
        const x = point.x * cosY + point.z * sinY;
        const z = point.z * cosY - point.x * sinY;
        const y = point.y * cosX - z * sinX;
        const depth = point.y * sinX + z * cosX;
        const perspective = 1 + depth * 0.22;
        const opacity = Math.max(0.12, Math.min(1, 0.55 + depth * 0.55));
        element.style.transform = `translate3d(${centerX + x * radius * perspective}px, ${centerY - y * radius * perspective}px, 0) translate(-50%, -50%) scale(${0.78 + 0.32 * perspective})`;
        element.style.opacity = String(opacity);
        element.style.zIndex = String(Math.round((depth + 1) * 50));
      }
    }

    projectRef.current = project;

    function tick(timestamp) {
      const delta = Math.min(timestamp - (lastTime || timestamp), 50);
      lastTime = timestamp;
      if (!dragRef.current && !reducedMotion) rotationRef.current.y += delta * AUTO_ROTATION;
      project();
      if (visible && !ancestorsHidden && !document.hidden && !minimized && !reducedMotion) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    }

    function start() {
      updateHidden();
      if (visible && !ancestorsHidden && !document.hidden && !minimized && !reducedMotion && !rafRef.current) {
        lastTime = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    function stop() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    function onVisibility() { if (document.hidden) stop(); else start(); }
    function onMotion(event) {
      reducedMotion = event.matches;
      if (reducedMotion) {
        stop();
        project();
      } else {
        start();
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0.02 });
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      project();
    });
    const mutations = ancestorWindow && new MutationObserver(() => {
      updateHidden();
      if (ancestorsHidden) stop(); else start();
    });
    observer.observe(stage);
    resize.observe(stage);
    if (mutations) mutations.observe(ancestorWindow, { attributes: true, attributeFilter: ['aria-hidden'] });
    document.addEventListener('visibilitychange', onVisibility);
    media?.addEventListener?.('change', onMotion);
    frame = requestAnimationFrame(() => { width = stage.clientWidth; height = stage.clientHeight; project(); start(); });

    return () => {
      stop();
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      mutations?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      media?.removeEventListener?.('change', onMotion);
      projectRef.current = null;
    };
  }, [minimized, points]);

  function onPointerDown(event) {
    if (event.button !== 0) return;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    rotationRef.current.y += dx * 0.007;
    rotationRef.current.x = Math.max(-1.1, Math.min(1.1, rotationRef.current.x + dy * 0.007));
    drag.x = event.clientX;
    drag.y = event.clientY;
    projectRef.current?.();
  }

  function onPointerEnd(event) {
    if (dragRef.current?.id !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className="ws-skills-globe">
      <div
        ref={stageRef}
        className="ws-skills-globe__stage"
        role="img"
        aria-label={locale === 'en' ? 'Rotating sphere of programming technologies' : 'Esfera de tecnologias de programação'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div className="ws-skills-globe__wireframe" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        {TECHNOLOGIES.map(({ name, icon: Icon, color }, index) => (
          <div
            key={name}
            ref={(node) => { itemRefs.current[index] = node; }}
            className="ws-skills-globe__item"
            style={{ '--technology-color': color }}
            aria-hidden="true"
          >
            <Icon className="ws-skills-globe__logo" />
            <span>{name}</span>
          </div>
        ))}
      </div>
      <p className="ws-skills-globe__hint">{help}</p>
      <ul className="ws-skills-globe__accessible">
        {TECHNOLOGIES.map(({ name }) => <li key={name}>{name}</li>)}
      </ul>
    </div>
  );
}