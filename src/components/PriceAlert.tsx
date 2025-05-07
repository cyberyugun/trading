'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiTrash2, FiBell } from 'react-icons/fi'
import { getQuote, StockQuote, convertCurrency } from '@/lib/yahooFinance'
import { formatIDR } from '@/lib/utils'

interface Alert {
  id: string
  symbol: string
  type: 'price' | 'indicator'
  condition: 'above' | 'below'
  value: number
  triggered: boolean
}

interface PriceAlertProps {
  symbol: string
}

const PriceAlert: React.FC<PriceAlertProps> = ({ symbol }) => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [convertedPrice, setConvertedPrice] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [newAlert, setNewAlert] = useState<Omit<Alert, 'id' | 'triggered'>>({
    symbol,
    type: 'price',
    condition: 'above',
    value: 0
  })

  // Update newAlert when symbol changes
  useEffect(() => {
    setNewAlert(prev => ({ ...prev, symbol }))
  }, [symbol])

  const fetchCurrentPrice = async () => {
    try {
      const quote = await getQuote(symbol)
      setCurrentPrice(quote.regularMarketPrice)
      
      // Convert USD to IDR
      const converted = await convertCurrency('USD', 'IDR', quote.regularMarketPrice)
      setConvertedPrice(converted)
    } catch (error) {
      console.error('Error fetching current price:', error)
      setError('Failed to fetch current price')
    }
  }

  const addAlert = async () => {
    if (!newAlert.value) return

    try {
      // Convert IDR to USD for storage
      const usdValue = await convertCurrency('IDR', 'USD', newAlert.value)
      
      const alert: Alert = {
        id: Date.now().toString(),
        symbol,
        type: newAlert.type || 'price',
        condition: newAlert.condition || 'above',
        value: usdValue,
        triggered: false
      }

      setAlerts([...alerts, alert])
      setNewAlert({
        symbol,
        type: 'price',
        condition: 'above',
        value: 0
      })
    } catch (error) {
      console.error('Error adding alert:', error)
      setError('Failed to add alert')
    }
  }

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  const checkAlerts = () => {
    const updatedAlerts = alerts.map(alert => {
      if (alert.triggered) return alert

      const triggered = alert.condition === 'above'
        ? currentPrice > alert.value
        : currentPrice < alert.value

      if (triggered) {
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(`Price Alert: ${symbol}`, {
            body: `${symbol} is now ${alert.condition} ${formatIDR(convertedPrice)}`,
            icon: '/favicon.ico'
          })
        }
      }

      return { ...alert, triggered }
    })

    setAlerts(updatedAlerts)
  }

  useEffect(() => {
    // Request notification permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }

    // Initial price fetch
    fetchCurrentPrice()

    // Set up price checking interval
    const interval = setInterval(() => {
      fetchCurrentPrice()
      checkAlerts()
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [symbol])

  const handleAlertTypeChange = (type: 'price' | 'indicator') => {
    setNewAlert(prev => ({ ...prev, type }))
  }

  const handleConditionChange = (condition: 'above' | 'below') => {
    setNewAlert(prev => ({ ...prev, condition }))
  }

  const handleValueChange = (value: number) => {
    setNewAlert(prev => ({ ...prev, value }))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Price Alerts</h2>
        <div className="text-sm text-gray-400">
          Current Price: {formatIDR(convertedPrice)}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">Alert Type</label>
            <select
              value={newAlert.type}
              onChange={(e) => handleAlertTypeChange(e.target.value as 'price' | 'indicator')}
              className="w-full px-3 py-2 bg-primary rounded text-white"
            >
              <option value="price">Price</option>
              <option value="indicator">Technical Indicator</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-400">Condition</label>
            <select
              value={newAlert.condition}
              onChange={(e) => handleConditionChange(e.target.value as 'above' | 'below')}
              className="w-full px-3 py-2 bg-primary rounded text-white"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>

          <div className="space-y-2 col-span-2">
            <label className="block text-sm text-gray-400">Value (IDR)</label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={newAlert.value || ''}
                onChange={(e) => handleValueChange(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-primary rounded text-white"
                placeholder="Enter value in IDR"
              />
              <button
                onClick={addAlert}
                className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover"
              >
                <FiPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-3 bg-secondary rounded"
          >
            <div className="flex items-center space-x-3">
              <FiBell className={`w-5 h-5 ${alert.triggered ? 'text-green-400' : 'text-gray-400'}`} />
              <div>
                <div className="font-medium">
                  {alert.symbol} {alert.condition} {formatIDR(alert.value)}
                </div>
                <div className="text-sm text-gray-400">
                  {alert.type === 'price' ? 'Price Alert' : 'Technical Indicator Alert'}
                </div>
              </div>
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="p-2 text-gray-400 hover:text-red-400"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PriceAlert 