@echo off
setlocal enabledelayedexpansion
cd /d "D:\Users\vowas\Desktop\ТЕСТОВЫЕ\Saburova_Elena_Infotek_test\frontend"
echo Starting typecheck...
.\node_modules\.bin\vue-tsc.cmd -b --noEmit 2>&1
set RC=%errorlevel%
echo Return code: !RC!
if !RC! equ 0 (
  echo TYPECHECK PASSED
) else (
  echo TYPECHECK FAILED
)
exit /b !RC!
