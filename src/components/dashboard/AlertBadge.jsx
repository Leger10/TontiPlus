import React from 'react';

const AlertBadge = ({ count, type = 'default' }) => {
  if (!count) return null;
  
  const styles = {
    danger: "bg-destructive text-destructive-foreground",
    warning: "bg-accent text-accent-foreground",
    success: "bg-primary text-primary-foreground",
    default: "bg-muted-foreground text-white"
  };

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${styles[type]}`}>
      {count}
    </span>
  );
};

export default AlertBadge;