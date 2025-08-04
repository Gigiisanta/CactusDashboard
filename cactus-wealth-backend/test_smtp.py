#!/usr/bin/env python3
"""
Script de test para verificar la configuración SMTP de SendGrid
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def test_smtp_configuration():
    """Test de configuración SMTP con SendGrid"""
    
    # Configuración SMTP
    smtp_host = os.getenv("EMAIL_SERVER_HOST", "smtp.sendgrid.net")
    smtp_port = int(os.getenv("EMAIL_SERVER_PORT", "587"))
    smtp_user = os.getenv("EMAIL_SERVER_USER", "apikey")
    smtp_password = os.getenv("EMAIL_SERVER_PASS", "")
    email_from = os.getenv("EMAIL_FROM", "Cactus Wealth <gsantarelli@grupoabax.com>")
    
    # Email de prueba
    test_email = "gsantarelli@grupoabax.com"
    
    print("🧪 Test de Configuración SMTP - SendGrid")
    print("=" * 50)
    print(f"Host: {smtp_host}")
    print(f"Puerto: {smtp_port}")
    print(f"Usuario: {smtp_user}")
    print(f"Contraseña: {'*' * len(smtp_password) if smtp_password else 'NO CONFIGURADA'}")
    print(f"From: {email_from}")
    print(f"To: {test_email}")
    print()
    
    if not all([smtp_host, smtp_user, smtp_password, email_from]):
        print("❌ Error: Configuración SMTP incompleta")
        print("Verifica las siguientes variables de entorno:")
        print("- EMAIL_SERVER_HOST")
        print("- EMAIL_SERVER_USER")
        print("- EMAIL_SERVER_PASS")
        print("- EMAIL_FROM")
        return False
    
    try:
        # Crear mensaje de prueba
        msg = MIMEMultipart()
        msg['From'] = email_from
        msg['To'] = test_email
        msg['Subject'] = f"🧪 Test SMTP - Cactus Wealth ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"
        
        # Cuerpo del mensaje
        html_body = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="utf-8">
            <title>Test SMTP - Cactus Wealth</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🌵</div>
                    <h1 style="color: #16a34a; margin: 0; font-size: 28px; font-weight: 700;">Cactus Wealth</h1>
                    <p style="color: #64748b; margin: 8px 0 0 0; font-size: 16px;">Test de Configuración SMTP</p>
                </div>
                
                <div style="background-color: #f1f5f9; padding: 32px; border-radius: 8px;">
                    <h2 style="color: #1e293b; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">✅ Configuración SMTP Exitosa</h2>
                    
                    <p style="color: #475569; margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
                        ¡Excelente! La configuración SMTP de SendGrid está funcionando correctamente.
                    </p>
                    
                    <div style="background-color: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 16px; margin: 24px 0;">
                        <p style="color: #166534; margin: 0; font-weight: 600;">
                            ✅ El sistema de verificación de email está listo para producción
                        </p>
                    </div>
                    
                    <p style="color: #64748b; margin: 24px 0 0 0; font-size: 14px;">
                        <strong>Detalles del test:</strong><br>
                        • Host: {smtp_host}<br>
                        • Puerto: {smtp_port}<br>
                        • Usuario: {smtp_user}<br>
                        • Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 32px;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    © 2024 Cactus Wealth - Financial Advisory Dashboard
                </p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        🌵 Cactus Wealth - Test SMTP

        ✅ Configuración SMTP Exitosa

        ¡Excelente! La configuración SMTP de SendGrid está funcionando correctamente.

        Detalles del test:
        • Host: {smtp_host}
        • Puerto: {smtp_port}
        • Usuario: {smtp_user}
        • Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

        El sistema de verificación de email está listo para producción.

        © 2024 Cactus Wealth
        """
        
        msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        # Conectar y enviar
        print("🔌 Conectando a SendGrid SMTP...")
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            print("🔐 Iniciando autenticación...")
            server.login(smtp_user, smtp_password)
            print("📧 Enviando email de prueba...")
            server.send_message(msg)
        
        print("✅ ¡Test SMTP exitoso!")
        print(f"📬 Email de prueba enviado a: {test_email}")
        print("🎉 La configuración SMTP está lista para producción")
        return True
        
    except Exception as e:
        print(f"❌ Error en test SMTP: {str(e)}")
        print("\n🔧 Posibles soluciones:")
        print("1. Verifica que la API Key de SendGrid sea correcta")
        print("2. Asegúrate de que Single Sender Verification esté activado")
        print("3. Verifica que el email FROM esté verificado en SendGrid")
        print("4. Revisa que las variables de entorno estén configuradas")
        return False

if __name__ == "__main__":
    success = test_smtp_configuration()
    exit(0 if success else 1) 