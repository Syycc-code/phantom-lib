@echo off
echo ========================================
echo Phantom Library 网络诊断工具
echo ========================================
echo.

echo [1/4] 检查后端服务...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 后端连接正常 (localhost:8000)
) else (
    echo ❌ 后端连接失败
    echo    请确保后端已启动: cd backend ^&^& uvicorn main:app --reload
)
echo.

echo [2/4] 检查端口占用...
netstat -ano | findstr :8000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 端口8000已被占用（正常）
    netstat -ano | findstr :8000
) else (
    echo ⚠️  端口8000未被占用（后端可能未启动）
)
echo.

echo [3/4] 检查VPN状态...
ipconfig | findstr "VPN\|Tunnel\|TAP" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  检测到VPN连接
    echo    建议在VPN设置中排除localhost流量
    ipconfig | findstr "VPN\|Tunnel\|TAP"
) else (
    echo ℹ️  未检测到VPN（或VPN未影响网络适配器）
)
echo.

echo [4/4] 检查系统代理...
netsh winhttp show proxy | findstr "Direct" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 系统代理：直接连接
) else (
    echo ⚠️  系统代理：已配置代理服务器
    netsh winhttp show proxy
)
echo.

echo ========================================
echo 诊断完成！
echo.
echo 如果后端连接失败，请尝试：
echo 1. 重启前端服务 (npm run dev)
echo 2. 检查VPN设置（参考NETWORK_TROUBLESHOOTING.md）
echo 3. 临时关闭VPN测试
echo ========================================
pause
