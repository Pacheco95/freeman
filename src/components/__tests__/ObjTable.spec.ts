import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ObjTable from '@/components/ObjTable.vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type TestData = {
  name: string
  value: string
}

type Row = { data: TestData; active: boolean }

describe('ObjTable', () => {
  const columns = [
    { title: 'Name', field: 'name' as keyof TestData },
    { title: 'Value', field: 'value' as keyof TestData },
  ]
  const getRows = (wrapper: ReturnType<typeof mount>) =>
    (wrapper.vm as unknown as { rows: Row[] }).rows

  it('renders table with columns and placeholder row', async () => {
    const wrapper = mount(ObjTable<TestData>, {
      props: { columns },
      global: {
        components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
        stubs: ['Checkbox', 'Input', 'Button'],
      },
    })
    await nextTick()

    expect(wrapper.findAll('tr')).toHaveLength(2) // header + placeholder row
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Value')
  })

  it('does not add empty row to model — placeholder is separate from model', async () => {
    const rows: Row[] = [{ data: { name: 'test', value: '123' }, active: false }]
    const wrapper = mount(ObjTable<TestData>, {
      props: { columns },
      global: {
        components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
        stubs: ['Checkbox', 'Input', 'Button'],
      },
    })
    await wrapper.setProps({ rows })
    await nextTick()

    expect(getRows(wrapper)).toHaveLength(1)
  })

  it('removes row when delete button is clicked', async () => {
    const rows: Row[] = [
      { data: { name: 'test1', value: '123' }, active: false },
      { data: { name: 'test2', value: '456' }, active: false },
    ]
    const wrapper = mount(ObjTable<TestData>, {
      props: { columns },
      global: {
        components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
        stubs: ['Checkbox', 'Input', 'Button'],
      },
    })
    await wrapper.setProps({ rows })
    await nextTick()

    const deleteButtons = wrapper.findAllComponents({ name: 'Button' })
    expect(deleteButtons).toHaveLength(2)

    await deleteButtons[0]!.trigger('click')
    await nextTick()

    const tableRows = getRows(wrapper)
    expect(tableRows).toHaveLength(1)
    expect(tableRows[0]!.data.name).toBe('test2')
  })

  it('toggles active state via checkbox', async () => {
    const rows: Row[] = [{ data: { name: 'test', value: '123' }, active: false }]
    const wrapper = mount(ObjTable<TestData>, {
      props: { columns },
      global: {
        components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
        stubs: ['Checkbox', 'Input', 'Button'],
      },
    })
    await wrapper.setProps({ rows })
    await nextTick()

    const checkbox = wrapper.findComponent({ name: 'Checkbox' })
    await checkbox.vm.$emit('update:modelValue', true)
    await nextTick()

    expect(getRows(wrapper)[0]!.active).toBe(true)
  })

  it('updates data via input', async () => {
    const rows: Row[] = [{ data: { name: 'existing', value: 'val' }, active: true }]
    const wrapper = mount(ObjTable<TestData>, {
      props: { columns },
      global: {
        components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
        stubs: ['Checkbox', 'Input', 'Button'],
      },
    })
    await wrapper.setProps({ rows })
    await nextTick()

    const inputs = wrapper.findAllComponents({ name: 'Input' })
    expect(inputs).toHaveLength(4) // 2 for the real row + 2 for the placeholder row

    await inputs[0]!.setValue('new name')
    await nextTick()

    expect(getRows(wrapper)[0]!.data.name).toBe('new name')
  })

  it('reorders rows on drag and drop', async () => {
    const rows: Row[] = [
      { data: { name: 'first', value: '1' }, active: false },
      { data: { name: 'second', value: '2' }, active: false },
    ]
    const wrapper = mount(ObjTable<TestData>, {
      props: { columns, rows },
      global: {
        components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
        stubs: ['Checkbox', 'Input', 'Button'],
      },
    })
    await nextTick()

    const dragHandles = wrapper.findAll('span[draggable="true"]')
    const bodyRows = wrapper.findAll('tbody tr')
    const dataTransfer = { effectAllowed: '' }

    await dragHandles[0]!.trigger('dragstart', { dataTransfer })
    await bodyRows[1]!.trigger('drop')
    await nextTick()

    expect(dataTransfer.effectAllowed).toBe('move')
    const tableRows = getRows(wrapper)
    expect(tableRows[0]!.data.name).toBe('second')
    expect(tableRows[1]!.data.name).toBe('first')
  })

  it('placeholder row has no drag handle', async () => {
    const rows: Row[] = [
      { data: { name: 'first', value: '1' }, active: false },
      { data: { name: 'second', value: '2' }, active: false },
    ]
    const wrapper = mount(ObjTable<TestData>, {
      props: { columns, rows },
      global: {
        components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
        stubs: ['Checkbox', 'Input', 'Button'],
      },
    })
    await nextTick()

    const dragHandles = wrapper.findAll('span[draggable="true"]')
    expect(dragHandles).toHaveLength(2) // only the two real rows have drag handles
  })
})
