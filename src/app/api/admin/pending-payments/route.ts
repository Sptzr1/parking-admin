import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking") // Usar la base de datos correcta

    console.log("🔍 Buscando pagos pendientes en la colección 'pagos'...")

    const pendingPayments = await db
      .collection("pagos")
      .find({
        estado: "pendiente_validacion",
        estadoValidacion: "pendiente",
      })
      .sort({ fechaPago: -1 })
      .project({
        _id: 1,
        ticketId: 1,
        codigoTicket: 1,
        tipoPago: 1,
        referenciaTransferencia: 1,
        banco: 1,
        telefono: 1,
        numeroIdentidad: 1,
        montoPagado: 1,
        montoPagadoUsd: 1,
        montoCalculado: 1,
        montoCalculadoTotal: 1, // Added to include total calculated amount
        tasaCambioUsada: 1,
        fechaPago: 1,
        estado: 1,
        estadoValidacion: 1,
        tiempoSalida: 1,
        tiempoSalidaEstimado: 1,
        carInfo: 1,
        urlImagenComprobante: 1,
        urlImagenTickets: 1, // Nuevo campo para la imagen de tickets múltiples
        isMultiplePayment: 1, // Included multiple payment flag
        ticketQuantity: 1, // Included number of tickets
      })
      .toArray()

    console.log(`✅ Encontrados ${pendingPayments.length} pagos pendientes`)

    // Debug: verificar comprobantes y campos de pago múltiple
    pendingPayments.forEach((payment) => {
      console.log(`🔍 Pago ${payment.codigoTicket} - Comprobante: ${payment.urlImagenComprobante ? "SÍ" : "NO"}`)
      console.log(`🔍 Pago ${payment.codigoTicket} - Tickets: ${payment.urlImagenTickets ? "SÍ" : "NO"}`) // Nuevo log para tickets
      console.log(`📋 Datos del pago:`, {
        codigoTicket: payment.codigoTicket,
        tipoPago: payment.tipoPago,
        banco: payment.banco,
        montoPagado: payment.montoPagado,
        estado: payment.estado,
        isMultiplePayment: payment.isMultiplePayment ?? false,
        ticketQuantity: payment.ticketQuantity ?? 1,
      })
    })

    const response = NextResponse.json(pendingPayments)
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")

    return response
  } catch (error) {
    console.error("Error fetching pending payments:", error)
    return NextResponse.json({ message: "Error al obtener pagos pendientes" }, { status: 500 })
  }
}