export default function getLabel(label: string) {
    return label.trim().replace(/_/g, ' ')
}