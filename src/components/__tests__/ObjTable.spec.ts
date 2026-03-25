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

describe('ObjTable', () => {
  const columns = [
    { title: 'Name', field: 'name' as keyof TestData },
    { title: 'Value', field: 'value' as keyof TestData },
  ]

  it('renders table with columns and initial empty row', async () => {
    const wrapper = mount(ObjTable<TestData>, {
      props: { columns },
      global: {
        components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
        stubs: ['Checkbox', 'Input', 'Button'],
      },
    })
    await nextTick()

    expect(wrapper.findAll('tr')).toHaveLength(2) // header + 1 row
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Value')
  })

  it('adds empty row when last row has data', async () => {
    const rows: { data: TestData; active: boolean }[] = [
      { data: { name: 'test', value: '123' }, active: false },
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

    expect(wrapper.vm.rows).toHaveLength(2)
    expect(wrapper.vm.rows?.[1]!.data.name).toBe('')
    expect(wrapper.vm.rows?.[1]!.data.value).toBe('')
  })

  it('removes row when delete button is clicked', async () => {
    const rows: { data: TestData; active: boolean }[] = [
      { data: { name: 'test1', value: '123' }, active: false },
      { data: { name: 'test2', value: '456' }, active: false },
      { data: { name: '', value: '' }, active: false },
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
    expect(deleteButtons).toHaveLength(2) // two non-empty rows

    await deleteButtons[0]!.trigger('click')
    await nextTick()

    expect(wrapper.vm.rows).toHaveLength(2) // one removed, but empty row remains
    expect(wrapper.vm.rows?.[0]!.data.name).toBe('test2')
  })

  it('toggles active state via checkbox', async () => {
    const rows: { data: TestData; active: boolean }[] = [
      { data: { name: 'test', value: '123' }, active: false },
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

    const checkbox = wrapper.findComponent({ name: 'Checkbox' })
    await checkbox.vm.$emit('update:modelValue', true)
    await nextTick()

    expect(wrapper.vm.rows?.[0]!.active).toBe(true)
  })

  it('updates data via input', async () => {
    const rows: { data: TestData; active: boolean }[] = [
      { data: { name: '', value: '' }, active: false },
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

    const inputs = wrapper.findAllComponents({ name: 'Input' })
    expect(inputs).toHaveLength(2) // name and value

    await inputs[0]!.setValue('new name')
    await nextTick()

    expect(wrapper.vm.rows?.[0]!.data.name).toBe('new name')
  })

  // Note: Drag and drop testing with @vue/test-utils is complex and often requires mocking or e2e tests.
  // For unit tests, we can test the logic indirectly or skip if not critical.
})
