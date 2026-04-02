import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResponsePanel from '@/components/ResponsePanel.vue'

const stubs = {
  BodyEditor: {
    template:
      '<div data-testid="body-editor" :data-language="language" :data-readonly="readOnly" :data-value="modelValue" />',
    props: ['modelValue', 'readOnly', 'language'],
  },
  WaitingResponse: { template: '<div data-testid="waiting-response" />' },
  HttpStatusIndicator: { template: '<div />', props: ['status'] },
  Tabs: { template: '<div><slot /></div>' },
  TabsList: { template: '<div><slot /></div>' },
  TabsTrigger: { template: '<div><slot /></div>', props: ['value'] },
  TabsContent: { template: '<div><slot /></div>', props: ['value'] },
  Table: { template: '<table><slot /></table>' },
  TableHeader: { template: '<thead><slot /></thead>' },
  TableBody: { template: '<tbody><slot /></tbody>' },
  TableRow: { template: '<tr><slot /></tr>' },
  TableHead: { template: '<th><slot /></th>' },
  TableCell: { template: '<td><slot /></td>' },
  Empty: { template: '<div data-testid="empty-body"><slot /></div>' },
  EmptyHeader: { template: '<div><slot /></div>' },
  EmptyMedia: { template: '<div><slot /></div>', props: ['variant'] },
  EmptyTitle: { template: '<div><slot /></div>' },
  EmptyDescription: { template: '<div><slot /></div>' },
}

function mockResponse(contentType: string, status = 200): Response {
  return {
    status,
    headers: {
      get: (name: string) => (name === 'content-type' ? contentType : null),
      forEach: (cb: (value: string, key: string) => void) => {
        cb(contentType, 'content-type')
      },
    },
  } as unknown as Response
}

function mountPanel(response: Response | null | undefined, body: string | undefined) {
  return mount(ResponsePanel, {
    props: { response, body },
    global: { stubs },
  })
}

describe('ResponsePanel', () => {
  describe('display states', () => {
    it('shows WaitingResponse when there is no response', () => {
      const wrapper = mountPanel(null, undefined)
      expect(wrapper.find('[data-testid="waiting-response"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="empty-body"]').exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'BodyEditor' }).exists()).toBe(false)
    })

    it('shows WaitingResponse when response is undefined', () => {
      const wrapper = mountPanel(undefined, undefined)
      expect(wrapper.find('[data-testid="waiting-response"]').exists()).toBe(true)
    })

    it('shows the empty body state when a response has no body', () => {
      const wrapper = mountPanel(mockResponse('text/plain'), undefined)
      expect(wrapper.find('[data-testid="empty-body"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="waiting-response"]').exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'BodyEditor' }).exists()).toBe(false)
    })

    it('shows the empty body state when the body is an empty string', () => {
      const wrapper = mountPanel(mockResponse('application/json'), '')
      expect(wrapper.find('[data-testid="empty-body"]').exists()).toBe(true)
    })

    it('shows BodyEditor when response has a body', () => {
      const wrapper = mountPanel(mockResponse('application/json'), '{"ok":true}')
      expect(wrapper.find('[data-testid="body-editor"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="waiting-response"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="empty-body"]').exists()).toBe(false)
    })
  })

  describe('body language detection', () => {
    it.each([
      ['application/json', 'json'],
      ['application/json; charset=utf-8', 'json'],
      ['text/html', 'html'],
      ['text/html; charset=utf-8', 'html'],
      ['text/xml', 'xml'],
      ['application/xml', 'xml'],
      ['application/xhtml+xml', 'xml'],
      ['text/css', 'css'],
      ['application/javascript', 'javascript'],
      ['text/javascript', 'javascript'],
      ['text/plain', 'plaintext'],
      ['application/octet-stream', 'plaintext'],
      ['', 'plaintext'],
    ])('maps content-type "%s" to language "%s"', (contentType, expectedLanguage) => {
      const wrapper = mountPanel(mockResponse(contentType), 'response body')
      expect(wrapper.find('[data-testid="body-editor"]').attributes('data-language')).toBe(
        expectedLanguage,
      )
    })
  })

  describe('BodyEditor props', () => {
    it('passes the body string to BodyEditor', () => {
      const body = '{"id":1,"name":"test"}'
      const wrapper = mountPanel(mockResponse('application/json'), body)
      expect(wrapper.find('[data-testid="body-editor"]').attributes('data-value')).toBe(body)
    })

    it('sets BodyEditor to read-only', () => {
      const wrapper = mountPanel(mockResponse('application/json'), '{}')
      expect(wrapper.find('[data-testid="body-editor"]').attributes('data-readonly')).toBe('true')
    })
  })
})
