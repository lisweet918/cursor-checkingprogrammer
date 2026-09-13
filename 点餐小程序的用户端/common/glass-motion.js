// Decorative touch feedback only: no gesture interception or navigation.
export function glassPoint(event) {
	const touches = event && event.touches
	if (!touches || touches.length !== 1) return null
	const touch = touches[0]
	return Number.isFinite(touch.clientX) && Number.isFinite(touch.clientY)
		? { x: touch.clientX, y: touch.clientY } : null
}

export function mapGlassPoint(point, rect) {
	if (!point || !rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.top) || !(rect.width > 0) || !(rect.height > 0)) return { x: 50, y: 50 }
	const clamp = value => Math.round(Math.max(0, Math.min(100, value)))
	return { x: clamp((point.x - rect.left) / rect.width * 100), y: clamp((point.y - rect.top) / rect.height * 100) }
}

export default {
	data() { return { glassTouches: {} } },
	computed: {
		glassStyles() {
			const styles = {}
			;['dock', 'user', 'dine', 'takeout'].forEach(key => { styles[key] = this.glassStyle(key) })
			return styles
		}
	},
	onHide() { this.glassReset() },
	beforeDestroy() { this.glassReset() },
	methods: {
		glassPressed(key) { return !!(this.glassTouches[key] && this.glassTouches[key].pressed) },
		glassStyle(key) {
			const state = this.glassTouches[key] || { x: 50, y: 50 }
			return { '--glass-x': state.x + '%', '--glass-y': state.y + '%', '--glass-rotate': ((state.x - 50) / 65).toFixed(2) + 'deg' }
		},
		glassStart(key, event) {
			const point = glassPoint(event)
			if (!point) { this.glassEnd(key); return }
			if (!this._glassSessions) this._glassSessions = {}
			const session = { origin: point, point, rect: null, lastPaint: 0 }
			this._glassSessions[key] = session
			this.$set(this.glassTouches, key, { x: 50, y: 50, pressed: true })
			try {
				uni.createSelectorQuery().in(this).select('.glass-touch-' + key).boundingClientRect(rect => {
					// Late callbacks from released/cancelled touches cannot relight glass.
					if (!this._glassSessions || this._glassSessions[key] !== session) return
					session.rect = rect
					this.$set(this.glassTouches, key, { ...mapGlassPoint(session.point, rect), pressed: true })
				}).exec()
			} catch (error) { /* A centered highlight also works without node queries. */ }
		},
		glassMove(key, event) {
			const session = this._glassSessions && this._glassSessions[key]
			if (!session) return
			const point = glassPoint(event)
			if (!point) { this.glassEnd(key); return }
			const dx = Math.abs(point.x - session.origin.x)
			const dy = Math.abs(point.y - session.origin.y)
			// Vertical scrolling takes over without leaving a card pressed.
			if (dy > 14 && dy >= dx) { this.glassEnd(key); return }
			session.point = point
			const now = Date.now()
			if (now - session.lastPaint < 32) return
			session.lastPaint = now
			this.$set(this.glassTouches, key, { ...mapGlassPoint(point, session.rect), pressed: true })
		},
		glassEnd(key) {
			if (this._glassSessions) delete this._glassSessions[key]
			if (this.glassTouches[key]) this.$set(this.glassTouches, key, { ...this.glassTouches[key], pressed: false })
		},
		glassReset() { this._glassSessions = {}; this.glassTouches = {} }
	}
}
