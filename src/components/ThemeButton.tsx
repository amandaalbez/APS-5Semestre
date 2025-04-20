import { IconButton, Menu, MenuItem } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import { useState } from 'react';

interface ThemeButtonProps {
  onThemeChange: (theme: string) => void;
}

export const ThemeButton = ({ onThemeChange }: ThemeButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (theme: string) => {
    onThemeChange(theme);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        aria-label="mudar tema"
        aria-controls={open ? 'theme-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Brightness4Icon />
      </IconButton>
      <Menu
        id="theme-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleThemeSelect('light')}>Claro</MenuItem>
        <MenuItem onClick={() => handleThemeSelect('dark')}>Escuro</MenuItem>
      </Menu>
    </>
  );
};
