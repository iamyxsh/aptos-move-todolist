import { useEffect, useState } from "react"
import { Network, Provider } from "aptos"
import { Checkbox } from "antd"

declare global {
	interface Window {
		aptos: any
	}
}

type Task = {
	completed: boolean
	content: string
	id: string
}

export const provider = new Provider(Network.DEVNET)

export const moduleAddress =
	"0xb80d8be0093f141efb04114768b8d97ce294117833208d3c22d8bcfe33f092b9"

export default function Home() {
	const [account, setAccount] = useState("")
	const [task, setTask] = useState("")
	const [resource, setResource] = useState<any[]>([])

	useEffect(() => {
		const getAcc = async () => {
			const { address } = await window.aptos.account()
			setAccount(address)
		}

		getAcc()
	}, [])

	useEffect(() => {
		if (account) fetchTasks()
	}, [account])

	const fetchTasks = async () => {
		const todoListResource = await provider
			.getAccountResource(account, `${moduleAddress}::todolist::Todolist`)
			.catch((err) => console.log(err))

		if (!todoListResource) return

		const tableHandle = (todoListResource.data as any).tasks.handle
		const counter = (todoListResource.data as any).counter
		let tasks = []

		for (let i = 0; i <= counter; i++) {
			const tableItem = {
				key_type: "u64",
				value_type: `${moduleAddress}::todolist::Task`,
				key: `${i}`,
			}
			const task = await provider.getTableItem(tableHandle, tableItem)
			tasks.push(task)
		}
		setResource(tasks)
	}

	const submitTask = async () => {
		const tx = {
			type: "entry_function_payload",
			function: `${moduleAddress}::todolist::create_task`,
			arguments: [task],
			type_arguments: [],
		}

		await window.aptos.signAndSubmitTransaction(tx)
	}

	const handleCompleted = async (id: number) => {
		const tx = {
			type: "entry_function_payload",
			function: `${moduleAddress}::todolist::complete_task`,
			arguments: [id],
			type_arguments: [],
		}

		await window.aptos.signAndSubmitTransaction(tx)
		await fetchTasks()
	}

	return (
		<div className="flex flex-col space-y-2">
			{!account ? (
				<button
					onClick={async () => {
						const { address } = await window.aptos.connect()
						setAccount(address)
					}}
				>
					Connect Wallet
				</button>
			) : (
				<button
					onClick={() => {
						window.aptos.disconnect()
						setAccount("")
					}}
				>
					Disconnect Wallet
				</button>
			)}
			<input type="text" onChange={(e) => setTask(e.target.value)} />
			<button onClick={() => submitTask()}>Submit</button>
			{resource!.length > 0 &&
				resource!.map((task) => (
					<div
						key={task.id}
						className="flex flex-col space-y-2 w-[10rem] m-auto"
					>
						<div className="flex justify-between">
							<div>{task.content}</div>
							<Checkbox
								checked={task.completed}
								onChange={() => handleCompleted(task.id)}
							/>
						</div>
					</div>
				))}
		</div>
	)
}
