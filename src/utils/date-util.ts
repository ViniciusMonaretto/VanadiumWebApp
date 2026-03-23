export function formatLocalDateToCustomString(date: Date) {
    // Get local time components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    // Generate microseconds (can be random or based on more precise sources)
    const microseconds = '000000'; // You could generate this or extract from more precise sources

    // Combine them into the required format
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${microseconds}`;
  }

  export function getLastActivityLabel(date: Date): string {
    if (!date) return 'Ativo há muito tempo';

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMinutes = Math.floor(diffMs / (60 * 1000));

    if (diffMinutes < 0) return 'Ativo agora';
    if (diffMinutes === 0) return 'Ativo a menos de 1 minuto atrás';
    if (diffMinutes === 1) return 'Ativo há 1 minuto';
    if (diffMinutes < 60) return `Ativo há ${diffMinutes} minutos`;
    const hours = Math.floor(diffMinutes / 60);
    if (hours === 1) return 'Ativo há 1 hora';
    return `Ativo há ${hours} horas`;
  }