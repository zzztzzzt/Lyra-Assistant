from pathlib import Path
import torch
import torch.nn as nn


class LyraTorchModel(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.fc1 = nn.Linear(3, 64, bias=True)
        self.ln1 = nn.LayerNorm(64)
        self.fc2 = nn.Linear(64, 64, bias=True)
        self.fc3 = nn.Linear(64, 27, bias=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = torch.relu(self.fc1(x))
        x = self.ln1(x)
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        return x


def load_model(pt_path: Path, device: str = "cpu") -> LyraTorchModel:
    model = LyraTorchModel().to(device)
    state = torch.load(pt_path, map_location=device)
    model.load_state_dict(state, strict=True)
    model.eval()
    return model
